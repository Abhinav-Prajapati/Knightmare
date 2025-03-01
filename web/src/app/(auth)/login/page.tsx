"use client"

// External library imports
import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Internal imports
import { Input } from "@/components/ui/input";
import { useAuthStore } from '@/store/auth';
import GoogleLoginIcon from '../../../../public/icons8-google-48.png';

// Schema definition
const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type SignupFormFields = z.infer<typeof signupSchema>;

interface AuthResponse {
  token: string;
  id: string;
  name: string;
  email: string;
}

const API_BASE_URL = "http://localhost:3000";

const SignupForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormFields>({
    resolver: zodResolver(signupSchema)
  });

  const signupMutation = useMutation({
    mutationFn: async (formData: SignupFormFields) => {
      return axios.post<AuthResponse>(`${API_BASE_URL}/user/signin`, {
        email: formData.email,
        password: formData.password
      });
    },
    onSuccess: (response) => {
      const { token, id, name: username, email } = response.data;
      const user = { id, username, email };

      login(token, user);
      router.push('/');
    },
    onError: (error: Error) => {
      console.error('Sign-in failed:', error.message);
    }
  });

  const onSubmit: SubmitHandler<SignupFormFields> = (data) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="px-10 pt-12 pb-10 mt-5 mb-4 max-w-full rounded-2xl bg-slate-50 w-[490px] max-md:px-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <h1 className="text-4xl font-semibold text-neutral-600 text-center">
          Sign Up
        </h1>

        {/* Email Field */}
        <div className="flex flex-col mt-4">
          <span className={errors.email ? "text-red-500" : "text-neutral-800"}>
            {errors.email?.message || "Email"}
          </span>
          <Input
            {...register("email")}
            className="text-md"
            type="email"
            placeholder="Enter your email"
          />
          <div className="h-px border border-solid bg-neutral-400 border-neutral-400" />
        </div>

        {/* Password Field */}
        <div className="flex flex-col mt-4">
          <span className={errors.password ? "text-red-500" : "text-neutral-800"}>
            {errors.password?.message || "Password"}
          </span>
          <Input
            {...register("password")}
            className="text-md"
            type="password"
            placeholder="Enter a password"
          />
          <div className="h-px border border-solid bg-neutral-400 border-neutral-400" />
        </div>

        <button
          type="submit"
          className="justify-center items-center px-16 py-5 mt-10 text-xl whitespace-nowrap rounded-[100px] text-white text-opacity-80 max-md:px-5 max-md:mt-10 bg-gradient-to-r from-blue-700 to-purple-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Loading..." : "SIGN UP"}
        </button>
      </form>

      <Divider />

      <div className="w-full flex justify-center">
        <Image
          alt="Sign in with Google"
          src={GoogleLoginIcon}
        />
      </div>

      <div className="flex gap-1.5 self-center mt-7 text-[1.2rem]">
        <span className="text-neutral-500">
          Already have an account?
        </span>
        <a href="/signin" className="text-purple-500">
          Sign In
        </a>
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div className="flex gap-2 mt-7 text-xl text-black whitespace-nowrap max-md:mt-10 ml-3">
    <div className="flex gap-1">
      <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
      <div>OR</div>
    </div>
    <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
  </div>
);

const SignInPage: React.FC = () => (
  <div className="flex flex-col justify-center text-base bg-gradient-to-tr to-[#A348DF] from-[#7143E2] h-screen">
    <div className="flex justify-center items-center px-16 py-20 w-full max-md:px-5 max-md:max-w-full">
      <div className="flex flex-col">
        <SignupForm />
      </div>
    </div>
  </div>
);

export default SignInPage;
